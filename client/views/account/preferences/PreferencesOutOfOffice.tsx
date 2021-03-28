import React, { useCallback, useMemo, useState } from "react";
import {
  Accordion,
  Box,
  Button,
  Field,
  FieldGroup,
  TextInput,
  TextAreaInput,
} from "@rocket.chat/fuselage";

import { useTranslation } from "../../../contexts/TranslationContext";
import { useEndpointAction } from "../../../hooks/useEndpointAction";
import { UserAutoComplete } from "../../../components/AutoComplete";

function PreferencesOutOfOffice({ ...props }) {
  const t = useTranslation() as any;

  const [rooms, setRooms] = useState("");
  const [deputy, setDeputy] = useState(""); // contains the usernames
  const [
    customMessage,
    setCustomMessage,
  ] = useState(`Sorry, I am currently Out of Office! 
Can you please redirect your messages to my assigning deputy. Thank you`);

  const handleAddRooms = (e: any) => setRooms(e?.currentTarget.value);

  const enableEndpoint = useEndpointAction(
    "POST",
    "users.outOfOffice.enable",
    useMemo(
      () => ({
        enable: true,
        roomIds: rooms.split(","),
        deputyUsername: deputy,
        customMessage,
      }),
      [rooms, deputy, customMessage]
    ),
    t("OUT OF OFFICE ENABLED")
  );

  const disableEndpoint = useEndpointAction(
    "POST",
    "users.outOfOffice.disable",
    useMemo(() => ({ enable: false }), []),
    t("OUT OF OFFICE DISABLED")
  );

  const enableOutOfOffice = useCallback(async () => {
    await enableEndpoint();
  }, [enableEndpoint]);

  const disableOutOfOffice = useCallback(async () => {
    await disableEndpoint();
  }, [disableEndpoint]);

  return (
    // change the buttons to toggle switches so that useForm can be used
    <Accordion.Item title={t("Out Of Office")} {...props}>
      <FieldGroup>
        <Field>
          <Field.Label>
            {t("Select the Channels for Out of Office")}
          </Field.Label>
          <Field.Row>
            <TextInput
              onChange={handleAddRooms}
              value={rooms}
              placeholder={"channels to be selected"}
            />
          </Field.Row>
        </Field>
        <Field>
          <Field.Label>{t("Select the assigning deputy")}</Field.Label>
          <Field.Row>
            <UserAutoComplete
              /*
            // @ts-ignore */
              value={deputy}
              onChange={setDeputy}
              placeholder={"select the users"}
            />
          </Field.Row>
        </Field>
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
        <Field>
          <Field.Label>{t("Custom Message")}</Field.Label>
          <Field.Row>
            <TextAreaInput
              value={customMessage}
              onChange={(e) => setCustomMessage((e.target as any).value)}
              rows={2}
            />
          </Field.Row>
          <Field.Hint>
            {t(
              "A message that will be sent to the channel when you are being mentioned"
            )}
          </Field.Hint>
        </Field>
      </FieldGroup>
    </Accordion.Item>
  );
}

export default PreferencesOutOfOffice;
