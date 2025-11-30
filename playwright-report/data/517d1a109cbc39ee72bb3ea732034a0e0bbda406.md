# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Welcome, admin!" [level=1] [ref=e6]
    - button "Logout" [active] [ref=e7] [cursor=pointer]
  - generic [ref=e8]:
    - generic [ref=e9]:
      - heading "User Information" [level=2] [ref=e10]
      - generic [ref=e11]:
        - strong [ref=e12]: "Name:"
        - text: admin
      - generic [ref=e13]:
        - strong [ref=e14]: "Email:"
        - text: admin@example.com
      - generic [ref=e15]:
        - strong [ref=e16]: "User ID:"
        - text: N/A
    - generic [ref=e17]:
      - generic [ref=e18]:
        - heading "Protected Content" [level=3] [ref=e19]
        - paragraph [ref=e20]: This content is only visible to authenticated users.
      - generic [ref=e21]:
        - heading "User Actions" [level=3] [ref=e22]
        - paragraph [ref=e23]: Here you can add user-specific functionality.
      - generic [ref=e24]:
        - heading "API Access" [level=3] [ref=e25]
        - paragraph [ref=e26]: Use the access token to make authenticated API requests.
```