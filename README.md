# StockLens

Scan Your Spending, See Your Missed Investing

## How to Run

1. Clone the repository
2. Install dependencies

    ```bash
    npm install
    ```

3. Launch the Expo development server

    ```bash
    npm start
    ```

4. Use the Expo Go app on your mobile device or an emulator to view the app, You can scan the QR code provided by the Expo server in the terminal to launch the app.

## Testing

To run the test suite for StockLens, follow these steps:

1. Ensure all dependencies are installed by running:

    ```bash
    npm install
    ```

2. Run the tests using the following command:

    ```bash
    npm test
    ```

This will execute all test files located in the `src/__tests__/` directory using Jest. The tests cover various components and functionalities of the StockLens app to ensure everything works as expected.

## Test Suite Structure

The test suite is organized within the `src/__tests__/` directory, which contains the following subdirectories:

- `fixtures/`: Contains mock data used across multiple tests, such as sample receipts, user data, OCR responses, and stock data.
- `contexts/`: Tests for context providers like authentication and theming.
- `hooks/`: Tests for custom React hooks used in the application.
- `screens/`: Tests for user interface screens and workflows, including login, scanning, and dashboard functionalities.
- `services/`: Tests for business logic components, including OCR processing, investment projections, and database interactions.
- `utils/`: Tests for utility functions such as data formatters and helpers.
Each test file is named according to the component or functionality it tests, making it easy to locate and understand the purpose of each test. The tests utilize Jest's features, including mocking and assertions, to validate the behavior of the app's components and services.
