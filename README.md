# Google Assistant Audio File Testing

## Getting started

1. Go to the [Actions console](http://console.actions.google.com)
2. Create a new project. This project can be independent of your other projects.
   - You can use this project to test any of your actions that are in a test state
3. For this new project, enable the [Google Assistant API](https://console.developers.google.com/apis/api/embeddedassistant.googleapis.com/overview)
4. Go to the **Device Registration** section.
5. Click **REGISTER MODEL**
   1. Fill out the product and manufacturer name
   1. Set the Device type to _Light_, although the choice does not matter
6. Download the `credentials.json` file
7. Use this credentials file to generate test credentials:

```bash
node generate-credentials.js /path/to/credentials.json
```

8. Copy and paste the URL and enter the authorization code. You will see a response
   similar to the following:

`Saved user credentials in "test-credentials.json"`
9. Register a new device instance using [googlesamples-assistant-devicetool](https://github.com/googlesamples/assistant-sdk-python/tree/master/google-assistant-sdk) and update DEVICE_MODEL_ID and DEVICE_INSTANCE_ID constants in index.ts.

```bash
googlesamples-assistant-devicetool --project-id PROJECT_ID register-device --device 'my-device-identifier' \ --model 'my-model-identifier' \ --nickname 'My Assistant Light'
```

10. Run sample

```bash
yarn
yarn start
```

11. If assistant says you need to allow personal results, open Google Home app on your smartphone and check notifications in the app. Once it's allowed, you'll be able to start testing!
12. Modify index.ts and write your tests.
