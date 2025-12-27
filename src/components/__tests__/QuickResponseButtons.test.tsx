import { describe, it, expect, vi } from 'vitest';
import { render } from '@/test/utils';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { QuickResponseButtons } from '../QuickResponseButtons';

describe('QuickResponseButtons', () => {
  const mockOptions = ['Yes', 'No', 'Not sure'];

  it('renders all options', () => {
    const onSelect = vi.fn();
    render(<QuickResponseButtons options={mockOptions} onSelect={onSelect} />);
    
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /not sure/i })).toBeInTheDocument();
  });

  it('calls onSelect when button is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    
    render(<QuickResponseButtons options={mockOptions} onSelect={onSelect} />);
    
    await user.click(screen.getByRole('button', { name: /yes/i }));
    expect(onSelect).toHaveBeenCalledWith('Yes');
  });

  it('disables all buttons when disabled prop is true', () => {
    const onSelect = vi.fn();
    render(
      <QuickResponseButtons
        options={mockOptions}
        onSelect={onSelect}
        disabled={true}
      />
    );
    
    mockOptions.forEach((option) => {
      expect(screen.getByRole('button', { name: new RegExp(option, 'i') })).toBeDisabled();
    });
  });

  it('shows selected state for selected options', () => {
    const onSelect = vi.fn();
    render(
      <QuickResponseButtons
        options={mockOptions}
        onSelect={onSelect}
        selectedOptions={['Yes']}
      />
    );
    
    const yesButton = screen.getByRole('button', { name: /yes/i });
    expect(yesButton).toHaveClass('bg-primary');
  });

  it('shows checkmark icon for selected options', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <QuickResponseButtons
        options={mockOptions}
        onSelect={onSelect}
        selectedOptions={['Yes']}
      />
    );
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });
});
