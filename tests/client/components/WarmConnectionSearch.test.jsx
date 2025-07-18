import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WarmConnectionSearch from '../../../client/src/components/WarmConnectionSearch';

// Mock fetch function
global.fetch = jest.fn();

describe('WarmConnectionSearch Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup fetch mock with default response
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        paths: [
          { path: "You → John Smith → Acme Corp", strength: 85 }
        ],
        runId: "test-run-id"
      })
    });
  });

  test('renders search form correctly', () => {
    render(<WarmConnectionSearch searchUrl="/api/search" apiKey="test-key" />);
    
    // Check that main elements are rendered
    expect(screen.getByText(/Find your warm connections/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search for a company or person/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
  });

  test('handles search submission', async () => {
    render(<WarmConnectionSearch searchUrl="/api/search" apiKey="test-key" />);
    
    // Fill in the search query
    const searchInput = screen.getByPlaceholderText(/Search for a company or person/i);
    fireEvent.change(searchInput, { target: { value: 'Acme Corp' } });
    
    // Submit the form
    const searchButton = screen.getByRole('button', { name: /Search/i });
    fireEvent.click(searchButton);
    
    // Verify fetch was called with correct parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/search",
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'test-key'
          }),
          body: expect.stringContaining('Acme Corp')
        })
      );
    });
    
    // Verify results are displayed after successful fetch
    await waitFor(() => {
      expect(screen.getByText(/You → John Smith → Acme Corp/i)).toBeInTheDocument();
    });
  });

  test('displays loading state during search', async () => {
    // Setup a delayed response to observe loading state
    global.fetch.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ 
              paths: [{ path: "Test Path", strength: 80 }],
              runId: "test-run-id"
            })
          });
        }, 100);
      });
    });
    
    render(<WarmConnectionSearch searchUrl="/api/search" apiKey="test-key" />);
    
    // Fill and submit search
    const searchInput = screen.getByPlaceholderText(/Search for a company or person/i);
    fireEvent.change(searchInput, { target: { value: 'Test Company' } });
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));
    
    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText(/Searching.../i)).toBeInTheDocument();
    });
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/Test Path/i)).toBeInTheDocument();
    });
  });
});