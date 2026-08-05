# Split & Bridge: pannello compatto e selezione edge separata

## Obiettivo

Rendere più compatto il pannello Split & Bridge e sostituire il campo testuale unico per due archi con due campi distinti, mantenendo invariato il comportamento dell’operazione.

## Design

- Il pannello `.command-card` avrà spaziature, larghezza e tipografia ridotte.
- La sezione di selezione mostrerà due input reali, uno per ciascun ID edge, affiancati quando c’è spazio e impilati su viewport strette.
- I due input saranno sincronizzati con lo stato di selezione esistente: il clic destro su un edge continuerà ad aggiornare i campi nell’ordine di selezione.
- Il comando leggerà i due valori separatamente, applicherà la validazione esistente e chiamerà la stessa funzione `splitAndBridgeEdges`.
- Il contatore degli archi selezionati e i messaggi di stato resteranno invariati.

## Approccio tecnico

Si manterrà il modello dati `state.selectedSplitEdges` già utilizzato dall’applicazione. La sincronizzazione aggiornerà entrambi gli input in base ai token selezionati; la gestione del comando recupererà un token da ciascun input e rifiuterà valori mancanti o non validi senza introdurre una nuova rappresentazione dello stato.

## Verifica

- Verificare che il markup contenga due input accessibili con label associate.
- Verificare che la selezione tramite clic destro aggiorni i due campi nell’ordine corretto.
- Verificare che il comando continui a rifiutare selezioni incomplete e a eseguire la trasformazione con due valori validi.
- Verificare visivamente il pannello su viewport larga e stretta.
