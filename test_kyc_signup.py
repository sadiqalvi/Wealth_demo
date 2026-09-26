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

for sub in ['identity', 'details', 'register', 'signup', 'email_send', 'init', 'start', 'credentials']:
    s, j = kyc_req('POST', f'applications/{app_id}/identity', {'sub_step': sub, 'email': 'test@example.pk', 'mobile': '03001234567'})
    if isinstance(j, dict) and 'job_id' in j:
        time.sleep(1)
        s2, res = kyc_req('GET', f'applications/{app_id}/jobs/{j["job_id"]}')
        print(f'sub_step: "{sub}" -> status: {res.get("status")} | error: {res.get("error")} | result: {res.get("result")}')
