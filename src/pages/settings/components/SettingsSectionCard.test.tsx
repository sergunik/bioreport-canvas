import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { User } from 'lucide-react';
import SettingsSectionCard from './SettingsSectionCard';

describe('SettingsSectionCard', () => {
  it('renders title and children', () => {
    render(
      <SettingsSectionCard title="Test Title">
        <div>Test Content</div>
      </SettingsSectionCard>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <SettingsSectionCard title="Test Title" description="Test Description">
        <div>Content</div>
      </SettingsSectionCard>
    );

    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(
      <SettingsSectionCard title="Test Title">
        <div>Content</div>
      </SettingsSectionCard>
    );

    const descriptions = container.querySelectorAll('[class*="CardDescription"]');
    expect(descriptions.length).toBe(0);
  });

  it('renders icon when provided', () => {
    const { container } = render(
      <SettingsSectionCard title="Test Title" icon={User}>
        <div>Content</div>
      </SettingsSectionCard>
    );

    // Check for icon wrapper div
    const iconWrapper = container.querySelector('.flex.h-10.w-10');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('does not render icon when not provided', () => {
    const { container } = render(
      <SettingsSectionCard title="Test Title">
        <div>Content</div>
      </SettingsSectionCard>
    );

    const iconWrapper = container.querySelector('.flex.h-10.w-10');
    expect(iconWrapper).not.toBeInTheDocument();
  });

  it('applies custom iconClassName when provided', () => {
    const { container } = render(
      <SettingsSectionCard
        title="Test Title"
        icon={User}
        iconClassName="bg-destructive/10 text-destructive"
      >
        <div>Content</div>
      </SettingsSectionCard>
    );

    const iconWrapper = container.querySelector('.bg-destructive\\/10.text-destructive');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('applies default icon styling when iconClassName not provided', () => {
    const { container } = render(
      <SettingsSectionCard title="Test Title" icon={User}>
        <div>Content</div>
      </SettingsSectionCard>
    );

    const iconWrapper = container.querySelector('.bg-secondary');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('applies custom cardClassName when provided', () => {
    const { container } = render(
      <SettingsSectionCard
        title="Test Title"
        cardClassName="border-destructive/20"
      >
        <div>Content</div>
      </SettingsSectionCard>
    );

    const card = container.querySelector('.border-destructive\\/20');
    expect(card).toBeInTheDocument();
  });

  it('renders multiple children correctly', () => {
    render(
      <SettingsSectionCard title="Test Title">
        <div>First Child</div>
        <div>Second Child</div>
        <div>Third Child</div>
      </SettingsSectionCard>
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByText('Third Child')).toBeInTheDocument();
  });

  it('renders with all props provided', () => {
    render(
      <SettingsSectionCard
        title="Complete Card"
        description="Full description"
        icon={User}
        iconClassName="bg-primary text-primary-foreground"
        cardClassName="border-primary"
      >
        <div>Full Content</div>
      </SettingsSectionCard>
    );

    expect(screen.getByText('Complete Card')).toBeInTheDocument();
    expect(screen.getByText('Full description')).toBeInTheDocument();
    expect(screen.getByText('Full Content')).toBeInTheDocument();
  });
});