# Repository instructions

## GitHub operations

- Per operazioni GitHub usa il terminale locale e GitHub CLI (`gh`).
- Non richiedere un nuovo login se `gh auth status` è valido.
- Prima di chiedere un nuovo login, esegui una verifica reale dell'API GitHub nello stesso ambiente della sessione con `gh api user --hostname github.com`. Se riesce, considera l'autenticazione valida e procedi con push e PR.
- Chiedi il login solo se `gh api user --hostname github.com` restituisce effettivamente un errore di autenticazione, riportandone l'output completo.
- Se il connettore GitHub restituisce `403`, usa direttamente la CLI.
- Se la sandbox blocca la rete, richiedi l’accesso di rete autorizzato.
