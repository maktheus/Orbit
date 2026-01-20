// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
