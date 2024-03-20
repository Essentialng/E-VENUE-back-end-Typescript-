interface ValidationField {
  name: string;
  maxLength: number;
}

export const validateInputLength = (
  fields: { [key: string]: string },
  validationFields: ValidationField[]
): string[] => {
  const errors: string[] = [];

  validationFields.forEach((field) => {
    if (fields[field.name] && fields[field.name].length > field.maxLength) {
      errors.push(field.name);
    }
  });

  return errors;
};
