// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import App from './App';

// Mock Tauri invokes
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(() => Promise.resolve([])),
}));

// Mock Lucide icons to avoid issues in testing environment if any
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
    };
});

describe('App', () => {
    it('renders the app title', () => {
        render(<App />);
        // Check for the main title or partial match since it might be in a span
        const titleElement = screen.getByText(/Orbit/i);
        expect(titleElement).toBeDefined();
    });

    it('navigates to pairing and handles pairing flow', async () => {
        cleanup(); // Ensure previous tests didn't leave artifacts
        const { invoke } = await import('@tauri-apps/api/core');

        // Setup mock to handle different commands
        invoke.mockImplementation((cmd, args) => {
            if (cmd === 'list_adb_devices') return Promise.resolve([]);
            if (cmd === 'adb_pair') return Promise.resolve('Success');
            return Promise.resolve(null);
        });

        render(<App />);

        // 1. Navigate to Pairing Tab
        // Scope to navigation to avoid potential multiple matches or global interference
        const nav = screen.getByRole('navigation');
        const pairTab = within(nav).getByText(/Pairing/i);
        fireEvent.click(pairTab);

        // Check if we are in Pairing view
        expect(await screen.findByText(/Wireless Pairing/i)).toBeDefined();

        // 2. Enter Pairing Details
        // We need to use placeholders or labels to find inputs
        // IP Input
        const ipInput = screen.getByPlaceholderText('192.168.1.x');
        const portInput = screen.getByPlaceholderText('30000');
        const codeInput = screen.getByPlaceholderText('123456');

        fireEvent.change(ipInput, { target: { value: '192.168.1.50' } });
        fireEvent.change(portInput, { target: { value: '40000' } });
        fireEvent.change(codeInput, { target: { value: '123456' } });

        // 3. Click Pair
        const pairButton = screen.getByText('Pair Device');
        pairButton.click();

        // 4. Verify Invoke called - expect 'Pairing with...' log or success log
        // The logs are rendered in the activity log
        await screen.findByText(/Pairing successful!/i);

        // 5. Verify transition back to manual connection (Active tab 'adb')
        // We wait for the state update
        const main = screen.getByRole('main');

        // Header should switch to 'ADB Devices' (or translated)
        await within(main).findByText(/ADB Devices/i, {}, { timeout: 3000 });

        // Manual Connection section should be visible - searching for the heading to avoid matching logs
        await screen.findByRole('heading', { name: /Manual Connection/i });

        // precise verify that we are back to ADB tab
        // expect(screen.getByText(/Manual Connection/i)).toBeInTheDocument(); // redundant and ambiguous


        // Verify connect IP is pre-filled
        // Verify connect IP is pre-filled
        const connectIpInput = screen.getByPlaceholderText(/IP Address/i);
        // In App.jsx: placeholder={t.ipAddress} -> "192.168.1.100" or similar?
        // Let's check App.jsx again for the placeholder of connect input.
        // It is `placeholder={t.ipAddress}`. 
        // We should check the *value* of the input.
        // We should check the *value* of the input.
        const connectInput = screen.getByDisplayValue('192.168.1.50');
        expect(connectInput).toBeTruthy();
    });
});
