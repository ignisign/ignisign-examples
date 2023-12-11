
import React, {useEffect, useState} from "react";

import { HeaderPage } from "../components-ui/headerPage";
import { Button } from "../components-ui/button";
import { FrontUrlProvider } from "../utils/front-url-provider";
import { useHistory, useLocation } from "react-router";
import { useGlobal } from "../contexts/global.context";
import Card from "../components-ui/card";
import { ExplanationHome1, Explanation_Embedded_BySide, Explanation_IsPrivateFile } from "../components/explanations";

export function HomePage() {
  const history = useHistory();
  const {signatureProfile,  isLoading} = useGlobal()

  return (
      <div>
          <div className="mt-4">
            <ExplanationHome1/>
            <div className="flex justify-center mt-4">
            <Button 
              disabled={!signatureProfile} 
              onClick={() => history.push(FrontUrlProvider.createContract())}>

                Start by creating a contract
            </Button>
            </div>
            <div className="mt-4">
              <Card className="flex-col">
                <div className="text-lg font-semibold">Signature Profile informations</div>
                <div className="mt-2">
                  <div>
                    {(signatureProfile) ? 
                    <>
                        <Explanation_Embedded_BySide/>
                        <Explanation_IsPrivateFile/>
                    </> : 
                    <>
                      {(isLoading) 
                        ? <div>Loading...</div>
                        : <div className="text-red-500">Cannot find signature profile</div>}
                    </>
                  }
                </div>
              </div>

            </Card>
          </div>

          
        </div>
      </div>
    
  )
}