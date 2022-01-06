import { render, screen } from '@testing-library/react';
import faker from 'faker';
import Button from './Button';

describe('Button', () => {
  it('should be able to mount', () => {
    const text = faker.lorem.word();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>{text}</Button>);

    const textElement = screen.getByText(text);
    expect(textElement).toBeInTheDocument();

    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeInTheDocument();

    buttonElement.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled and not handle click events', () => {
    const text = faker.lorem.word();
    const onClick = jest.fn();
    const disabled = true;
    render(
      <Button onClick={onClick} disabled={disabled}>
        {text}
      </Button>,
    );

    const textElement = screen.getByText(text);
    expect(textElement).toBeInTheDocument();

    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeInTheDocument();

    buttonElement.click();
    expect(onClick).toHaveBeenCalledTimes(0);
  });
});
