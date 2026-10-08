type ContactFormValues = {
  name: string;
  email: string;
  message: string;
};

export type ContactProps = {
  onSubmit: (e: ContactFormValues) => void;
};
