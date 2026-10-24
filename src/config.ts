/**
 * Per-dealer branding & connectivity config.
 * To rebrand this same codebase for a different dealer, change ONLY the
 * values below — nothing else in the app should hardcode a dealer name or ID.
 */

export const DEALER_NAME = "Sai Gems";

// The DealerID this app instance is locked to. Every register/login call
// sends this as the `X-Dealer-Id` header so the backend attaches the
// customer to the right dealer.
export const DEALER_ID = 2;

/**
 * Backend base URL.
 *
 * localhost does NOT work from a device/emulator — it refers to the device
 * itself, not your PC. Pick the right value for how you're testing:
 *
 *   - Android emulator (AVD):      http://10.0.2.2:7500
 *   - iOS simulator:                http://localhost:7500
 *   - Physical phone (USB/Wi-Fi):   http://<YOUR_PC_LAN_IP>:7500   <- current value
 *                                   (found via `ipconfig`; phone and PC must
 *                                   be on the same Wi-Fi network)
 *
 * CHANGE THIS when you switch between emulator and a real phone.
 * Emulator value, for switching back: http://10.0.2.2:7500
 */
export const API_BASE_URL = "https://rahfashion.net";
