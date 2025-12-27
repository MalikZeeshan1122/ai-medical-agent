import { describe, it, expect } from 'vitest';
import { render } from '@/test/utils';
import { screen } from '@testing-library/dom';
import { ChatMessage } from '../ChatMessage';

describe('ChatMessage', () => {
  it('renders user message correctly', () => {
    render(<ChatMessage role="user" content="Hello, I have a headache" />);
    expect(screen.getByText('Hello, I have a headache')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    render(
      <ChatMessage
        role="assistant"
        content="I understand you're experiencing a headache."
      />
    );
    expect(
      screen.getByText("I understand you're experiencing a headache.")
    ).toBeInTheDocument();
  });

  it('displays activity icon for assistant messages', () => {
    const { container } = render(
      <ChatMessage role="assistant" content="Test message" />
    );
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('does not display icon for user messages', () => {
    const { container } = render(
      <ChatMessage role="user" content="Test message" />
    );
    const icon = container.querySelector('svg');
    expect(icon).not.toBeInTheDocument();
  });

  it('applies correct styling for user messages', () => {
    const { container } = render(
      <ChatMessage role="user" content="Test message" />
    );
    const messageDiv = container.querySelector('.bg-primary');
    expect(messageDiv).toBeInTheDocument();
  });

  it('applies correct styling for assistant messages', () => {
    const { container } = render(
      <ChatMessage role="assistant" content="Test message" />
    );
    const messageDiv = container.querySelector('.bg-card');
    expect(messageDiv).toBeInTheDocument();
  });
});
