import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FormErrorText from './FormErrorText';

describe('FormErrorText', () => {
  it('renders error message when provided', () => {
    render(<FormErrorText message="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders nothing when message is undefined', () => {
    const { container } = render(<FormErrorText message={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when message is empty string', () => {
    const { container } = render(<FormErrorText message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('applies correct CSS classes for error styling', () => {
    render(<FormErrorText message="Error message" />);
    const element = screen.getByText('Error message');
    expect(element).toHaveClass('text-sm', 'text-destructive');
  });

  it('renders different error messages correctly', () => {
    const { rerender } = render(<FormErrorText message="First error" />);
    expect(screen.getByText('First error')).toBeInTheDocument();

    rerender(<FormErrorText message="Second error" />);
    expect(screen.getByText('Second error')).toBeInTheDocument();
    expect(screen.queryByText('First error')).not.toBeInTheDocument();
  });
});