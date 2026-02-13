interface FormErrorTextProps {
  message?: string;
}

export default function FormErrorText({ message }: FormErrorTextProps) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}
