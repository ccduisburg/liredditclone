import {  Button ,Box} from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { withUrqlClient } from 'next-urql';
import React, { useState } from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useForgotPasswordMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

 const ForgotPassword: React.FC<{}> = ({}) => {
    const [complete,setComplete]=useState(false);
    const [,forgotPassword]=useForgotPasswordMutation();
        return (
        <Wrapper variant='small'>
        <Formik initialValues={{ email: ""}}
            onSubmit={async (values, { setErrors }) => {
                const response = await forgotPassword(values);
                setComplete(true);
            }}
        >
            {({ isSubmitting }) => (complete?(
                <Box>if an Account with that email exists, we sent you can email </Box>
            ):(
                <Form>
                    <InputField name="email" placeholder='email' label='Email' />                              
                 
                    <Button mt={4} type="submit"
                        colorScheme="teal"
                        isLoading={isSubmitting}
                        variant="solid">forgot password</Button>
                        
                       
                </Form>
            ))}
        </Formik>
    </Wrapper>);
}
export default withUrqlClient(createUrqlClient)(ForgotPassword);