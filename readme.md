# Domain Paid-Till Checker

A minimalist microservice built with **Express**. Check domain WHOIS expiry dates via a simple HTTP GET request.

## Features

- Check domain paid-till dates via WHOIS
- Returns JSON response and expiry information
- Returns HTTP status codes based on domain status to facilitate automation
- Built with Express for simplicity and performance

## Installation

Run this image with Docker:

```bash
docker run -d -p 3000:3000 --name domain-paid-till-checker \
  -e PORT=3000 \
  ghcr.io/talyguryn/domain-paid-till-checker:latest
```

## Usage

Send a GET request to the `/check` endpoint with the `domain` query parameter:

```bash
curl "http://localhost:3000/check?domain=example.com"
```

### Example Response

If the domain has an expiry date, you'll receive a response like this:

`HTTP 200` if everything is ok
`HTTP 402` if expiring within 7 days
`HTTP 410` if payment date already expired

```json
{
  "domain": "guryn.ru",
  "data": {
    "checkDate": "2026-02-03T08:29:30.651Z",
    "paidTillDate": "2026-07-12T05:58:24.000Z",
    "daysLeft": 158
  }
}
```

Or `HTTP 404` if no expiry date is found:

```json
{
  "domain": "example.com",
  "error": {
    "message": "No registry expiry date was found for domain example.com"
  }
}
```