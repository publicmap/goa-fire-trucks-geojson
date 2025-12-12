
import fetch from 'node-fetch';
import https from 'https';

const API_BASE_URL = 'https://3.7.238.246/webservice';
const API_USERNAME = 'cnt-fire.goa@nic.in';
const API_PASSWORD = 'cnt@123';
const API_COMPANY_NAME = 'Directorate of Fire Emergency Services';
const API_PROJECT_ID = 37;

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// Step 1: Generate access token
async function generateAccessToken() {
    console.log('\n=== STEP 1: Generating Access Token ===');
    const tokenUrl = `${API_BASE_URL}?token=generateAccessToken`;

    // Try different field name variations
    const requestVariations = [
        { Username: API_USERNAME, password: API_PASSWORD },
        { username: API_USERNAME, password: API_PASSWORD },
        { Username: API_USERNAME, Password: API_PASSWORD },
        { username: API_USERNAME, Password: API_PASSWORD },
        { user: API_USERNAME, pass: API_PASSWORD },
        { User: API_USERNAME, Pass: API_PASSWORD }
    ];

    for (let i = 0; i < requestVariations.length; i++) {
        const requestBody = requestVariations[i];

        try {
            console.log(`\nAttempt ${i + 1}/${requestVariations.length}`);
            console.log(`Token URL: ${tokenUrl}`);
            console.log(`Request Body: ${JSON.stringify(requestBody)}`);

            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                agent: httpsAgent,
                timeout: 10000
            });

            console.log(`Response Status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.log(`HTTP error: ${errorText}`);
                if (i < requestVariations.length - 1) {
                    console.log(`Trying next variation...`);
                    continue;
                }
                throw new Error(`Token generation failed with status ${response.status}: ${errorText}`);
            }

            const tokenData = await response.json();
            console.log(`Token Response: ${JSON.stringify(tokenData, null, 2)}`);

            // Check for error response format (result: 0 indicates error)
            if (tokenData.result === 0 || tokenData.result === '0') {
                const errorMsg = tokenData.message || 'Unknown server error';
                if (i < requestVariations.length - 1) {
                    console.log(`Server error with this variation, trying next: ${errorMsg}`);
                    continue;
                }
                throw new Error(`Server returned error: ${errorMsg}`);
            }

            // Extract token from response
            let token = tokenData.token || tokenData.Token || tokenData.access_token || tokenData.accessToken;

            if (!token && tokenData.data) {
                token = tokenData.data.token || tokenData.data.Token || tokenData.data;
            }

            if (!token && typeof tokenData === 'string') {
                token = tokenData;
            }

            if (!token && (tokenData.result === 1 || tokenData.result === '1')) {
                for (const [key, value] of Object.entries(tokenData)) {
                    if (key !== 'result' && key !== 'message' && value && typeof value === 'string') {
                        token = value;
                        console.log(`Found token in field '${key}'`);
                        break;
                    }
                }
            }

            if (!token) {
                if (i < requestVariations.length - 1) {
                    console.log(`Token not found in response, trying next variation...`);
                    continue;
                }
                throw new Error(`Token not found in response. Response: ${JSON.stringify(tokenData)}`);
            }

            console.log(`✓ Access token generated successfully: ${token.substring(0, 20)}...`);
            return token;
        } catch (error) {
            if (i < requestVariations.length - 1) {
                console.error(`Attempt ${i + 1} failed: ${error.message}`);
                continue;
            }
            console.error(`✗ All token generation attempts failed: ${error.message}`);
            throw error;
        }
    }

    // If we get here, all variations failed
    throw new Error('All authentication attempts failed. Please check credentials and API documentation.');
}

// Step 2: Fetch live data using the access token
async function fetchLiveData(authToken) {
    console.log('\n=== STEP 2: Fetching Live Data ===');
    const dataUrl = `${API_BASE_URL}?token=getTokenBaseLiveData&ProjectId=${API_PROJECT_ID}`;

    try {
        console.log(`Data URL: ${dataUrl}`);
        console.log(`Auth Token: ${authToken.substring(0, 20)}...`);

        const response = await fetch(dataUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'auth-code': authToken
            },
            body: JSON.stringify({
                company_names: API_COMPANY_NAME,
                format: 'json'
            }),
            agent: httpsAgent,
            timeout: 10000
        });

        console.log(`Response Status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Live data fetch failed with status ${response.status}: ${errorText}`);
        }

        const jsonData = await response.json();
        console.log(`✓ Live data fetched successfully`);
        console.log(`Response preview: ${JSON.stringify(jsonData).substring(0, 500)}...`);

        // Extract vehicle data
        let rows = [];
        if (jsonData && jsonData.root && jsonData.root.VehicleData) {
            rows = jsonData.root.VehicleData;
        } else if (jsonData && Array.isArray(jsonData)) {
            rows = jsonData;
        } else if (jsonData && jsonData.data) {
            rows = Array.isArray(jsonData.data) ? jsonData.data : (jsonData.data.VehicleData || []);
        }

        console.log(`\n=== RESULTS ===`);
        console.log(`Total vehicles found: ${rows.length}`);

        if (rows.length > 0) {
            console.log(`\nFirst vehicle sample:`);
            console.log(JSON.stringify(rows[0], null, 2));
        }

        return jsonData;
    } catch (error) {
        console.error(`✗ Live data fetch failed: ${error.message}`);
        throw error;
    }
}

// Main test function
async function testApi() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing Fire Truck API`);
    console.log(`Base URL: ${API_BASE_URL}`);
    console.log(`${'='.repeat(60)}`);

    try {
        // Step 1: Generate token
        const authToken = await generateAccessToken();

        // Step 2: Fetch live data
        const liveData = await fetchLiveData(authToken);

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✓ API TEST COMPLETED SUCCESSFULLY`);
        console.log(`${'='.repeat(60)}\n`);

    } catch (error) {
        console.log(`\n${'='.repeat(60)}`);
        console.error(`✗ API TEST FAILED`);
        console.error(`Error: ${error.message}`);
        console.log(`${'='.repeat(60)}\n`);
        process.exit(1);
    }
}

testApi();
