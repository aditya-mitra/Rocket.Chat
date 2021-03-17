import React from "react";
import {
  Accordion,
  Box,
  Field,
  FieldGroup,
  ToggleSwitch,
} from "@rocket.chat/fuselage";

import { useTranslation } from "../../../contexts/TranslationContext";

function PreferencesOutOfOffice({ ...props }) {
  const t = useTranslation();

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
              <ToggleSwitch />
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
