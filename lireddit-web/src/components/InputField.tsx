import { FormControl, FormLabel, Input, FormErrorMessage, Textarea } from '@chakra-ui/react';
import { useField } from 'formik';
import React from 'react'

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
    name: string;  
    label: string;
    type?:'text'|'password';
    textarea?:boolean;
}

export const InputField: React.FC<InputFieldProps> = ({label, textarea, size:_, ...props}) => {
    let InputOrTextarea=Input
    if(textarea){
        InputOrTextarea=Textarea
    }
    const [field, { error} ] = useField(props);
    return (
        <FormControl isInvalid={!!error}>
            <FormLabel htmlFor={field.name}>{label}</FormLabel>
            <InputOrTextarea {...field} id={field.name} placeholder={props.placeholder} type={props.type} />
            {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}


        </FormControl>
    );
}