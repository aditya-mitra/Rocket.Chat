import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useEndpointData } from "/client/hooks/useEndpointData";

function PreferencesOutOfOffice({ ...props }) {
  const t = useTranslation() as any;

  const [rooms, setRooms] = useState("");
  const [deputy, setDeputy] = useState(""); // contains the usernames
  const [
    customMessage,
    setCustomMessage,
  ] = useState(`Sorry, I am currently Out of Office! 
Can you please redirect your messages to my assigning deputy. Thank you`);
  const [oofEnabled, setOofEnabled] = useState(false);

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
    setOofEnabled(true);
  }, [enableEndpoint]);

  const disableOutOfOffice = useCallback(async () => {
    await disableEndpoint();
    setOofEnabled(false);
  }, [disableEndpoint]);

  const {
    value: { isOutOfOffice = false } = { isOutOfOffice: false },
  } = useEndpointData("users.outOfOffice.info" as any);

  useEffect(() => {
    console.log('is it enabled?',isOutOfOffice);
    setOofEnabled(isOutOfOffice);
  }, [isOutOfOffice, setOofEnabled]);

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
              <Button onClick={enableOutOfOffice} disabled={oofEnabled}>
                Enable
              </Button>
            </Field.Row>
          </Box>
          <Field.Hint>
            {t("You will be Out of Office with your message being sent to the selected channels")}
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
              <Button onClick={disableOutOfOffice} disabled={!oofEnabled}>
                Disable
              </Button>
            </Field.Row>
          </Box>
          <Field.Hint>
            {t("You will be in Office and take command from your Deputy")}
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
              "A message which will be auto sent while you have enabled Out of Office"
            )}
          </Field.Hint>
        </Field>
      </FieldGroup>
    </Accordion.Item>
  );
}

export default PreferencesOutOfOffice;
