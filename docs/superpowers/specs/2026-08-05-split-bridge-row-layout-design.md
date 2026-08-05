# Split & Bridge: layout compatto su una riga

## Obiettivo

Semplificare ulteriormente il pannello Split & Bridge rendendo più diretto il flusso di inserimento dei due edge.

## Modifiche UI

- Rimuovere il titolo eyebrow `Trasformazione`.
- Abbreviare il suggerimento in `Clic destro su 2 archi o inserisci gli ID.`.
- Rimuovere il conteggio `selectionStatus` dalla UI e dal relativo aggiornamento JavaScript.
- Disporre i due input e il pulsante sulla stessa riga tramite una griglia a tre colonne.
- Mantenere un fallback responsive per viewport strette, evitando che input e pulsante diventino inutilizzabili.

## Vincoli

La selezione con clic destro, la sincronizzazione dei due input e la funzione `splitAndBridgeEdges` restano invariate. La modifica non deve alterare la trasformazione del grafo.

## Verifica

- Test statici: eyebrow e contatore assenti, testo abbreviato presente, griglia a tre colonne presente.
- Verifica JavaScript: `updateSplitSelectionUi` aggiorna ancora i due input senza dipendere da un elemento `selectionStatus`.
- Verifica responsive e controllo finale del test suite.
