// ---------- Conversion helpers ----------

// "192.168.1.10" -> 3232235786
// Shift each octet into its 8-bit slot, then OR them together.
function ipToInt(ip) {
  const octets = ip.split(".").map(Number);
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

// 3232235786 -> "192.168.1.10"
// Shift each 8-bit slot down to the bottom, then keep only those 8 bits with & 255.
function intToIp(num) {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join(".");
}

// 24 -> 4294967040 (255.255.255.0)
// Start with 32 one-bits and shift left to push zeros in on the right.
// /0 is special: JavaScript only uses the lowest 5 bits of a shift amount,
// so "<< 32" acts like "<< 0" and would give the wrong answer.
function prefixToMask(prefix) {
  if (prefix === 0) return 0;
  return (0xFFFFFFFF << (32 - prefix)) >>> 0;
}

// ---------- The calculation ----------

// Takes an IP string and a prefix number, returns all the results as strings/numbers.
// No DOM here, so it can be tested on its own in the console.
function calculateSubnet(ip, prefix) {
  const ipNum = ipToInt(ip);
  const mask = prefixToMask(prefix);

  const network = (ipNum & mask) >>> 0;     // keep network bits, zero host bits
  const broadcast = (network | ~mask) >>> 0; // set every host bit to 1
  const totalAddresses = 2 ** (32 - prefix); // ** instead of bit shifts: /0 needs 2^32, too big for 32-bit ops

  let firstHost, lastHost, usableHosts;

  if (prefix === 32) {
    // A single address: it is the only "host".
    firstHost = network;
    lastHost = network;
    usableHosts = 1;
  } else if (prefix === 31) {
    // Point-to-point link (RFC 3021): both addresses are usable.
    firstHost = network;
    lastHost = broadcast;
    usableHosts = 2;
  } else {
    // Normal case: skip the network and broadcast addresses.
    firstHost = network + 1;
    lastHost = broadcast - 1;
    usableHosts = totalAddresses - 2;
  }

  // The next network starts right after this one's broadcast address.
  // If the broadcast is 255.255.255.255 there is nothing after it (end of IPv4 space).
  const nextNetwork = broadcast === 0xFFFFFFFF ? "None (end of address space)" : intToIp(broadcast + 1);

  return {
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    nextNetwork: nextNetwork,
    mask: intToIp(mask),
    firstHost: intToIp(firstHost),
    lastHost: intToIp(lastHost),
    usableHosts: usableHosts,
  };
}

// ---------- Validation ----------

// Checks text like "192.168.1.0/24".
// Returns { ip, prefix } if it's valid, or { error: "message" } if it isn't.
function parseCidr(text) {
  const parts = text.trim().split("/");
  if (parts.length !== 2) {
    return { error: "Enter an IP address and prefix separated by a slash, like 192.168.1.0/24." };
  }

  const [ip, prefixText] = parts;

  const octets = ip.split(".");
  if (octets.length !== 4) {
    return { error: `"${ip}" isn't a valid IP address. It needs 4 numbers separated by dots.` };
  }
  for (const octet of octets) {
    // /^\d{1,3}$/ means "1 to 3 digits and nothing else", which rules out "", "-1", "1.5", "abc".
    if (!/^\d{1,3}$/.test(octet) || Number(octet) > 255) {
      return { error: `"${octet}" isn't valid in an IP address. Each part must be a number from 0 to 255.` };
    }
  }

  // Same idea for the prefix. Checking digits first matters: Number("") is 0, not an error.
  if (!/^\d{1,2}$/.test(prefixText) || Number(prefixText) > 32) {
    return { error: `"/${prefixText}" isn't a valid prefix. It must be a number from 0 to 32.` };
  }

  return { ip: ip, prefix: Number(prefixText) };
}

// ---------- Connecting to the page ----------

// Grab the elements once, up front, so we don't search the page on every submit.
const form = document.getElementById("subnet-form");
const input = document.getElementById("cidr-input");
const errorBox = document.getElementById("error");

// Write a results object into the <dd> slots.
function showResults(results) {
  document.getElementById("network").textContent = results.network;
  document.getElementById("broadcast").textContent = results.broadcast;
  document.getElementById("next-network").textContent = results.nextNetwork;
  document.getElementById("first-host").textContent = results.firstHost;
  document.getElementById("last-host").textContent = results.lastHost;
  // toLocaleString adds thousands separators: 4294967294 -> "4,294,967,294"
  document.getElementById("host-count").textContent = results.usableHosts.toLocaleString();
}

// Put the "–" placeholders back so old results don't sit next to a new error.
function clearResults() {
  for (const id of ["network", "broadcast", "next-network", "first-host", "last-host", "host-count"]) {
    document.getElementById(id).textContent = "–";
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the browser from reloading the page

  const parsed = parseCidr(input.value);

  if (parsed.error) {
    errorBox.textContent = parsed.error;
    clearResults();
    return; // stop here: don't calculate with bad input
  }

  errorBox.textContent = "";
  showResults(calculateSubnet(parsed.ip, parsed.prefix));
});
