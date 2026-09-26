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

tests = [
    ("Direct sub_step", {'sub_step': 'email_send', 'email': 'test@example.pk'}),
    ("Nested in payload", {'payload': {'sub_step': 'email_send', 'email': 'test@example.pk'}}),
    ("Nested in data", {'data': {'sub_step': 'email_send', 'email': 'test@example.pk'}}),
    ("Nested in answers", {'answers': {'sub_step': 'email_send', 'email': 'test@example.pk'}}),
    ("Query param ?sub_step=email_send", {'email': 'test@example.pk'}),
]

for name, payload in tests:
    url = f'applications/{app_id}/steps/identity'
    if "Query" in name:
        url += '?sub_step=email_send'
    s, j = kyc_req('POST', url, payload)
    if 'job_id' in j:
        time.sleep(1)
        s_res, j_res = kyc_req('GET', f'applications/{app_id}/jobs/{j["job_id"]}')
        print(f'{name}: status={j_res.get("status")}, error="{j_res.get("error")}"')
