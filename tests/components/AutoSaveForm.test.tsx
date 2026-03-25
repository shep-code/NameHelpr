import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutoSaveForm } from '../../src/components/AutoSaveForm';

// Mock db hooks
const mockAddPerson = vi.fn().mockResolvedValue(1);
vi.mock('../../src/db/hooks', () => ({
  usePersons: () => ({
    persons: [],
    addPerson: mockAddPerson,
    updatePerson: vi.fn(),
    deletePerson: vi.fn()
  })
}));

// Mock useLiveQuery for context autocomplete
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => ['Existing Context'])
}));

describe('AutoSaveForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockAddPerson.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ENTR-01: Single-screen layout', () => {
    it('renders name, context, and notes fields', () => {
      render(<AutoSaveForm onComplete={() => {}} onCancel={() => {}} />);
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/context/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });
  });

  describe('ENTR-02: Mobile keyboard attributes', () => {
    it('name input has autocapitalize="words"', () => {
      render(<AutoSaveForm onComplete={() => {}} onCancel={() => {}} />);
      expect(screen.getByLabelText(/name/i)).toHaveAttribute('autocapitalize', 'words');
    });

    it('name input has inputMode="text"', () => {
      render(<AutoSaveForm onComplete={() => {}} onCancel={() => {}} />);
      expect(screen.getByLabelText(/name/i)).toHaveAttribute('inputmode', 'text');
    });
  });

  describe('ENTR-03: Auto-save behavior', () => {
    it('does not save immediately on typing', () => {
      render(<AutoSaveForm onComplete={() => {}} onCancel={() => {}} />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/context/i), { target: { value: 'Party' } });

      // Check immediately - should not have saved yet
      expect(mockAddPerson).not.toHaveBeenCalled();
    });

    it('saves after 300ms debounce when form is blurred', async () => {
      render(<AutoSaveForm onComplete={() => {}} onCancel={() => {}} />);

      const nameInput = screen.getByLabelText(/name/i);
      const contextInput = screen.getByLabelText(/context/i);

      fireEvent.change(nameInput, { target: { value: 'John' } });
      fireEvent.change(contextInput, { target: { value: 'Party' } });

      // Blur from the form entirely (relatedTarget is null = focus left the form)
      fireEvent.blur(contextInput, { relatedTarget: null });

      // Advance past debounce delay and wait for effects
      await act(async () => {
        await vi.advanceTimersByTimeAsync(350);
      });

      // Wait for the async addPerson call to complete
      // Note: addPerson now takes contextTags as 4th parameter
      await vi.waitFor(() => {
        expect(mockAddPerson).toHaveBeenCalledWith('John', 'Party', undefined, []);
      });
    });

    it('does not save while navigating between form fields', async () => {
      render(<AutoSaveForm onComplete={() => {}} onCancel={() => {}} />);

      const nameInput = screen.getByLabelText(/name/i);
      const contextInput = screen.getByLabelText(/context/i);
      const notesInput = screen.getByLabelText(/notes/i);

      fireEvent.change(nameInput, { target: { value: 'John' } });
      fireEvent.change(contextInput, { target: { value: 'Party' } });

      // Blur context but focus moves to notes (relatedTarget is the notes field)
      fireEvent.blur(contextInput, { relatedTarget: notesInput });
      fireEvent.focus(notesInput);

      // Advance past debounce delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(350);
      });

      // Should NOT have saved because focus is still within the form
      expect(mockAddPerson).not.toHaveBeenCalled();
    });
  });
});
