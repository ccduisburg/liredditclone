import { Box, Button, Flex, Link } from '@chakra-ui/react';
import React from 'react'
import NextLink from 'next/link';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';

interface NavBarProps {

}

export const NavBar: React.FC<NavBarProps> = ({ }) => {
    const [{fetching:logoutFetching},logout]=useLogoutMutation();
    const [{ data, fetching }] = useMeQuery({
        pause: isServer(),
    });

    let body = null

 
    //Daten werden geladen 
    if (fetching) {

    }//Benutzer nicht angemeldet
    else if (!data?.me) {
        body = (
            <>
                <NextLink href="/login">
                    <Link mr={2}>login</Link>
                </NextLink>
                <NextLink href="/register">
                    <Link>register</Link>
                </NextLink>
            </>
        );
        //Benutzer angemeldet
    } else {
        body = (<>
            <Flex>
                <Box mr={2}>{data.me.username}</Box>
                <Button onClick={()=>{logout();}} 
                isLoading={logoutFetching}
                variant="link">logout</Button>
            </Flex>

        </>
        )
    }
    return (
        <Flex zIndex={1}  position="sticky" top={0} bg="tan" p={4} ml={'auto'}>
            <Box ml={"auto"}>
                {body}
            </Box>

        </Flex>
    );
}