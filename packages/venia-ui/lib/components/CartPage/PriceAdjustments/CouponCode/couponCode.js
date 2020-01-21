import React from 'react';

import gql from 'graphql-tag';

import { useCouponCode } from '@magento/peregrine/lib/talons/CartPage/PriceAdjustments/useCouponCode';
import Button from '../../../Button';
import { mergeClasses } from '../../../../classify';
import defaultClasses from './couponCode.css';
import { Form } from 'informed';
import Field from '../../../Field';
import TextInput from '../../../TextInput';

import { AppliedCouponsFragment } from './couponCodeFragments';
import { CartPageFragment } from '../../cartPageFragments';

export const APPLY_COUPON_MUTATION = gql`
    mutation applyCouponToCart($cartId: String!, $couponCode: String!) {
        applyCouponToCart(
            input: { cart_id: $cartId, coupon_code: $couponCode }
        ) {
            cart {
                ...CartPageFragment
            }
        }
    }
    ${CartPageFragment}
`;

export const REMOVE_COUPON_MUTATION = gql`
    mutation removeCouponFromCart($cartId: String!) {
        removeCouponFromCart(input: { cart_id: $cartId }) {
            cart {
                ...CartPageFragment
            }
        }
    }
    ${CartPageFragment}
`;

const GET_APPLIED_COUPONS = gql`
    query getAppliedCoupons($cartId: String!) {
        cart(cart_id: $cartId) {
            id
            ...AppliedCouponsFragment
        }
    }
    ${AppliedCouponsFragment}
`;

const CouponCode = props => {
    const classes = mergeClasses(defaultClasses, props.classes);

    const talonProps = useCouponCode({
        applyCouponMutation: APPLY_COUPON_MUTATION,
        getAppliedCouponsQuery: GET_APPLIED_COUPONS,
        removeCouponMutation: REMOVE_COUPON_MUTATION
    });

    const {
        applyError,
        applyingCoupon,
        data,
        fetchError,
        handleApplyCoupon,
        handleRemoveCoupon,
        removingCoupon
    } = talonProps;

    if (!data) {
        return null;
    }

    if (fetchError) {
        console.log(fetchError);
        return 'Something went wrong. Refresh and try again.';
    }

    if (data.cart.applied_coupons) {
        const codes = data.cart.applied_coupons.map(({ code }) => {
            return (
                <span className={classes.appliedCoupon} key={code}>
                    <span className={classes.code}>{code}</span>
                    <button
                        className={classes.removeButton}
                        disabled={removingCoupon}
                        onClick={() => {
                            handleRemoveCoupon(code);
                        }}
                    >
                        Remove
                    </button>
                </span>
            );
        });

        return <div className={classes.root}>{codes}</div>;
    } else {
        return (
            <Form className={classes.entryForm} onSubmit={handleApplyCoupon}>
                <Field id="couponCode" label="Coupon Code">
                    <TextInput
                        field="couponCode"
                        id={'couponCode'}
                        placeholder={'Enter code'}
                        message={
                            applyError ? 'An error occurred. Try again.' : ''
                        }
                    />
                </Field>
                {/* To ensure proper alignment, pass a space as the label.*/}
                <Field label={'\u00A0'}>
                    <Button
                        classes={{ root_normalPriority: classes.applyButton }}
                        disabled={applyingCoupon}
                        priority={'normal'}
                        type={'submit'}
                    >
                        {'Apply'}
                    </Button>
                </Field>
            </Form>
        );
    }
};

export default CouponCode;
