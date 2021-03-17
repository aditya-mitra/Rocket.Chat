import React, { useCallback } from "react";
import {
  Accordion,
  Box,
  Button,
  Field,
  FieldGroup,
} from "@rocket.chat/fuselage";

import { useTranslation } from "../../../contexts/TranslationContext";
import { useEndpointAction } from "../../../hooks/useEndpointAction";

function PreferencesOutOfOffice({ ...props }) {
  const t = useTranslation();

  const enableEndpoint = useEndpointAction(
    "POST",
    "users.outOfOffice",
    { enable: true },
    t("OUT OF OFFICE ENABLED")
  );

  const enableOutOfOffice = useCallback(async () => {
    const result = await enableEndpoint();
    console.log("the res from the endpoint action was", result);
  }, [enableEndpoint]);

  return (
    <Accordion.Item title={t("Out Of Office")} {...props}>
      <FieldGroup>
        <Field>
          <Box
            display="flex"
            flexDirection="row"
            justifyContent="spaceBetween"
            flexGrow={1}
          >
            <Field.Label>{t("Enable Out Of Office")}</Field.Label>
            <Field.Row>
              <Button onClick={enableOutOfOffice}>Enable</Button>
            </Field.Row>
          </Box>
          <Field.Hint>
            {t("Will send a message telling that you are now out of office")}
          </Field.Hint>
        </Field>
      </FieldGroup>
    </Accordion.Item>
  );
}

export default PreferencesOutOfOffice;
