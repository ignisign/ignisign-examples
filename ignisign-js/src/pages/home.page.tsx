
import React, {useEffect, useState} from "react";

import { HeaderPage } from "../components-ui/headerPage";
import { Button } from "../components-ui/button";
import { FrontUrlProvider } from "../utils/front-url-provider";
import { useHistory, useLocation } from "react-router";
import { useGlobal } from "../contexts/global.context";
import Card from "../components-ui/card";
import { ExplanationHome1 } from "../components/explanations";

export function HomePage() {
  const history = useHistory();
  const {disabled} = useGlobal()

  return (
      <div>
          <div className="mt-4">
            <ExplanationHome1/>
            <div className="flex justify-center mt-4">
            <Button disabled={disabled}
              onClick={() => history.push(FrontUrlProvider.createContract())}>
                Start by creating a contract
            </Button>
            </div>
        </div>
      </div>
    
  )
}