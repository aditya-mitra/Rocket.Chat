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

  const disableEndpoint = useEndpointAction(
    "POST",
    "users.outOfOffice",
    { enable: false },
    t("OUT OF OFFICE DISABLED")
  );

  const enableOutOfOffice = useCallback(async () => {
    await enableEndpoint();
  }, [enableEndpoint]);

  const disableOutOfOffice = useCallback(async () => {
    await disableEndpoint();
  }, [disableEndpoint]);

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
        <Field>
          <Box
            display="flex"
            flexDirection="row"
            justifyContent="spaceBetween"
            flexGrow={1}
          >
            <Field.Label>{t("Disable Out Of Office")}</Field.Label>
            <Field.Row>
              <Button onClick={disableOutOfOffice}>Disable</Button>
            </Field.Row>
          </Box>
          <Field.Hint>
            {t("Will remove the deputy from the channels")}
          </Field.Hint>
        </Field>
      </FieldGroup>
    </Accordion.Item>
  );
}

export default PreferencesOutOfOffice;
