# Subnet Calculator

A small browser tool that takes an IPv4 address in CIDR notation (like `192.168.1.0/24`) and shows the network address, broadcast address, usable host range and host count. Built for networking students who want to check their subnetting by hand.

**Live demo:** https://subnet-calc-jerome.vercel.app

<!-- Add a screenshot: save it as docs/screenshot.png, then uncomment the next line -->
<!-- ![Subnet Calculator screenshot](docs/screenshot.png) -->

## Features
- Enter any IPv4 address with a prefix from `/0` to `/32`
- Shows network address, broadcast address, next network address, first and last usable host, and total usable hosts
- Handles the edge cases: `/31` point-to-point links (RFC 3021) and `/32` single hosts
- Clear error messages for invalid input (bad octets, missing slash, prefix out of range)

## Built with
- HTML, CSS and plain JavaScript. No frameworks, no build step.

## Getting started
No install needed. Clone the repo and open `index.html` in your browser:

    git clone https://github.com/jequinz-09/subnet-calc.git
    cd subnet-calc
    start index.html

(On macOS use `open index.html`.)

## How it works
The IP address is converted to a 32-bit number, then bitwise operations do the work:
- **Network** = IP `AND` mask (zero the host bits)
- **Broadcast** = network `OR` inverted mask (set every host bit to 1)
- **Usable hosts** = 2^(32 − prefix) − 2

## What I learned
- How subnet masks map to bits, and how `&`, `|`, `~` and shifts calculate subnets
- JavaScript bitwise operators work on signed 32-bit numbers, so `>>> 0` is needed to keep results unsigned
- A shift of 32 acts like a shift of 0 in JavaScript, so `/0` needs special handling
- Validating input before calculating, with messages that tell the user what to fix

## Roadmap
- [ ] Show the subnet mask and wildcard mask
- [ ] Show addresses in binary
- [ ] Split a network into smaller subnets

## License
MIT - see [LICENSE](LICENSE).
