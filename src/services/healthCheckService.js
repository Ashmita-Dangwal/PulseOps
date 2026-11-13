
import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { Agent, fetch } from "undici";

// Check whether an IP address is publicly routable.
const isPublicIp = (address) => {
    try {
        const parsedAddress = ipaddr.process(address);

        // Only globally routable addresses are allowed.
        return parsedAddress.range() === "unicast";
    } catch {
        return false;
    }
};

// Resolve the hostname and reject private or reserved IP addresses.
const getSafeAddresses = async (hostname) => {
    // If the hostname is already an IP address, validate it directly.
    if (ipaddr.isValid(hostname)) {
        if (!isPublicIp(hostname)) {
            throw new Error("Monitoring local or private addresses is not allowed");
        }

        return [{ address: hostname, family: ipaddr.parse(hostname).kind() === "ipv4" ? 4 : 6 }];
    }

    // Resolve both IPv4 and IPv6 addresses.
    const addresses = await lookup(hostname, {
        all: true,
        verbatim: true
    });

    if (addresses.length === 0) {
        throw new Error("Hostname could not be resolved");
    }

    // Reject the hostname if any resolved address is not public.
    if (addresses.some(({ address }) => !isPublicIp(address))) {
        throw new Error("Monitoring local or private addresses is not allowed");
    }

    return addresses;
};

// Perform one health check.
export const performHealthCheck = async (monitor) => {
    const startTime = Date.now();
    let dispatcher;

    try {
        const url = new URL(monitor.url);

        if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("Only HTTP and HTTPS URLs are allowed");
        }

        if (url.username || url.password) {
            throw new Error("URLs containing credentials are not allowed");
        }

        // Resolve and validate the destination before making a request.
        const addresses = await getSafeAddresses(url.hostname);

        // Pin the request to an address that was already validated.
        const selectedAddress = addresses[0];

        dispatcher = new Agent({
            connect: {
                lookup: (hostname, options, callback) => {
                    if (options?.all) {
                        callback(null, addresses);
                    } else {
                        callback(
                            null,
                            selectedAddress.address,
                            selectedAddress.family
                        );
                    }
                }
            }
        });

        const response = await fetch(url, {
            method: monitor.method || "GET",
            signal: AbortSignal.timeout(monitor.timeout || 5000),
            redirect: "manual",
            dispatcher
        });

        const responseTime = Date.now() - startTime;
        const expectedStatus = monitor.expectedStatus || 200;
        const success = response.status === expectedStatus;

        return {
            monitorId: monitor.monitorId,
            success,
            statusCode: response.status,
            responseTime,
            errorType: success ? null : "UNEXPECTED_STATUS",
            errorMessage: success
                ? null
                : `Expected ${expectedStatus}, received ${response.status}`,
            checkedAt: new Date()
        };
    } catch (error) {
        return {
            monitorId: monitor.monitorId,
            success: false,
            statusCode: null,
            responseTime: Date.now() - startTime,
            errorType: error.name === "TimeoutError"
                ? "TIMEOUT"
                : "REQUEST_FAILED",
            errorMessage: error.message,
            checkedAt: new Date()
        };
    } finally {
        // Close the request agent to release its resources.
        if (dispatcher) {
            await dispatcher.close();
        }
    }
};
