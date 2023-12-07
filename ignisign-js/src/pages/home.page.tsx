
import React, {useEffect, useState} from "react";

import { HeaderPage } from "../components/headerPage";
import { Button } from "../components/button";
import { FrontUrlProvider } from "../utils/front-url-provider";
import { useHistory, useLocation } from "react-router";
import { useGlobal } from "../contexts/global.context";
import Card from "../components/card";

export function HomePage() {
  const history = useHistory();
  const {isEmbedded, signatureProfile, isFilesPrivates, webhooks, isLoading} = useGlobal()

  return (
      <div>
          <div className="mt-4">
            <div className="text-2xl">This is an example of how to use the Ignisign SDK to create a contract signing app.</div>
            <div className="mb-8 mt-2">
              This is a sample app showcasing how a seller and a customer can interact to sign a contract efficiently using the IgniSign service. IgniSign is an electronic signature solution that simplifies and secures the contract signing process.
            </div>
            <div className="text-xl">
              In this app:
            </div>
            <div>- The seller creates a contract between himself and a customer.</div>
            <div>- Both parties electronically sign the contract using IgniSign.</div>
            <div>- The signed document is securely stored, legally binding, and tamper-proof</div>
            <div className="mt-8">
              This example highlights how IgniSign modernizes contract signing, making it convenient and legally valid.
            </div>
            <div>
              <a href="https://doc.ignisign.io/#tag/Integrate-Ignisign-with-your-Backend" target="_blank" className="text-blue-500">Learn more about IgniSign</a>
            </div>

            <div className="my-8">
              <Card>
                <div>Signature profile informations</div>
                <div className="mt-2">
                  <div>
                    {
                      signatureProfile ? <>
                        <div>
                          <Card light>
                            {
                              isEmbedded ? <>
                                This signature profile is in embbeded mode. (webhook required to handle signature token of signers and provide them through iframe)
                                {
                                  webhooks?.length > 0 ? <>
                                    <div>Your webhooks:</div>
                                    <div>{webhooks.map(e=>e.url).join(', ')}</div>
                                  </> : <>
                                    <div>No webhook registered</div>
                                  </>
                                }
                              </> : <>
                                <div>
                                  This signature profile is in by side mode. Users will receive emails to sign the contract
                                </div>
                              </>
                            }
                          </Card>
                        </div>

                        {
                          isFilesPrivates && <>
                            <div className="bg-gray-600 mt-2">
                              <Card light>
                                <div>
                                  This signature profile is in private mode. Files will be not be stored in Ignisign
                                </div>
                                <div>
                                  You will need to handle the files by yourself and send through the Iframe to let Ignisign display them
                                </div>
                              </Card>
                            </div>
                          </>
                        }
                    </> : <>
                      {
                        isLoading ? <>
                          <div>Loading...</div>
                        </> : <>
                          <div className="text-red-500">Cannot find signature profile</div>
                        </>
                      }
                    </>
                  }
                </div>
              </div>

            </Card>
          </div>

          <div className="flex justify-center">
            <Button disabled={!signatureProfile} onClick={() => history.push(FrontUrlProvider.makeContract())}>Start by creating a contract</Button>
          </div>
        </div>
      </div>
    
  )
}