import urllib.request, ssl, json, time

ctx = ssl.create_default_context()
kyc_headers = {
    'PYPSX-ORG-API-KEY-ID': 'KYC_IONNYUQYPWYHWWSI',
    'PYPSX-ORG-API-SECRET-KEY': 'USZIMT3MBVUPO7RTWXWRDNOG34JJ5PL2OHW3E5Y',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0'
}

def kyc_req(method, path, body=None):
    url = f'https://brokerapi.pypsx.com/v1/kyc/{path}'
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=kyc_headers, method=method)
    try:
        res = urllib.request.urlopen(req, context=ctx)
        return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

app_id = 'e70d5c3da70edc7ac86b93812b0f1668'

# Test 1: POST /applications/{id}/steps/identity with sub_step
print('Test 1: POST /applications/{id}/steps/identity')
s1, j1 = kyc_req('POST', f'applications/{app_id}/steps/identity', {'sub_step': 'email_send', 'email': 'test@example.pk'})
print('Result:', s1, j1)
if 'job_id' in j1:
    time.sleep(1)
    print('Job:', kyc_req('GET', f'applications/{app_id}/jobs/{j1["job_id"]}'))

# Test 2: POST /applications/{id}/password
print('\nTest 2: POST /applications/{id}/password')
s2, j2 = kyc_req('POST', f'applications/{app_id}/password', {'password': 'Password123!'})
print('Result:', s2, j2)
if 'job_id' in j2:
    time.sleep(1)
    print('Job:', kyc_req('GET', f'applications/{app_id}/jobs/{j2["job_id"]}'))
