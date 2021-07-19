/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from 'bedrock';
import {Ed25519Signature2020} from '@digitalbazaar/ed25519-signature-2020';
import {Ed25519VerificationKey2020} from
  '@digitalbazaar/ed25519-verification-key-2020';
import {ZcapClient} from '@digitalbazaar/ezcap';

export let ZCAP_CLIENT;

bedrock.events.on('bedrock.init', async () => {
  // load client info for delegating meter usage zcaps
  const {usage: {rootController}} = bedrock.config['meter-http'];
  const {id} = rootController;
  const keyPair = await Ed25519VerificationKey2020.from(rootController.keyPair);
  ZCAP_CLIENT = new ZcapClient({
    id,
    delegationSigner: keyPair.signer(),
    SuiteClass: Ed25519Signature2020
  });
});
