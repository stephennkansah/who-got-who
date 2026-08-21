import { defineAuth } from '@aws-amplify/backend';

/**
 * Players get a stable Cognito Identity Pool identity without an account or
 * password. The unused email sign-in option leaves a clean path to optional
 * accounts later without making them part of the party-game flow.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
