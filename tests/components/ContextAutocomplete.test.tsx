import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextAutocomplete } from '../../src/components/ContextAutocomplete';

// Mock useLiveQuery to return test data
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => ['Alpha Event', 'Beta Meetup', 'Gamma Party'])
}));

describe('ContextAutocomplete', () => {
  it('renders input with datalist element', () => {
    render(<ContextAutocomplete value="" onChange={() => {}} />);
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('list', 'contexts');
    expect(document.getElementById('contexts')).toBeInTheDocument();
  });

  it('datalist contains distinct contexts from persons', () => {
    render(<ContextAutocomplete value="" onChange={() => {}} />);
    const options = document.querySelectorAll('#contexts option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue('Alpha Event');
  });

  it('calls onChange with input value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ContextAutocomplete value="" onChange={onChange} />);

    await user.type(screen.getByRole('combobox'), 'Test');
    expect(onChange).toHaveBeenCalled();
  });

  it('contexts are sorted alphabetically', () => {
    render(<ContextAutocomplete value="" onChange={() => {}} />);
    const options = Array.from(document.querySelectorAll('#contexts option'));
    const values = options.map(o => o.getAttribute('value'));
    expect(values).toEqual(['Alpha Event', 'Beta Meetup', 'Gamma Party']);
  });
});
