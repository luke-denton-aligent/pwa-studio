import { useCallback, useEffect, useMemo } from 'react';
import { useMutation } from '@apollo/react-hooks';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useAppContext } from '../../context/app';

export const useCartTrigger = props => {
    const { createCartMutation } = props;
    const [, { toggleDrawer }] = useAppContext();
    const [{ cartId, details }, { getCartDetails }] = useCartContext();

    const [fetchCartId] = useMutation(createCartMutation);

    // Whenever we get a new, valid cartId we should refetch details.
    useEffect(() => {
        if (cartId) {
            getCartDetails({
                fetchCartId
            });
        }
    }, [cartId, fetchCartId, getCartDetails]);

    const itemCount = useMemo(() => {
        return details.items_qty || 0;
    }, [details]);

    const handleClick = useCallback(() => {
        toggleDrawer('cart');
        getCartDetails();
    }, [getCartDetails, toggleDrawer]);

    return {
        handleClick,
        itemCount
    };
};
