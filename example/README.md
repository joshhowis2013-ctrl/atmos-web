# Atmos Web GitHub Pages example

This directory is the source marker for the public static example deployment.
The GitHub Pages workflow builds the deployable contents from the frontend files
in the repository root and deliberately excludes `server.js`, `.env`, and
Node.js configuration.

The example keeps the Open-Meteo forecast, pressure map, PWA assets, and
official Met Office warning fallback. Live Met Office warnings require the
private Node.js proxy and are not enabled on GitHub Pages.
