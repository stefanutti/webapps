# Split & Bridge: compact workspace and tools popover

## Obiettivo

Ridurre l'ingombro visivo di Split & Bridge su mobile e desktop e rendere opzionale l'area dei controlli inferiori, mantenendo il grafo come area di lavoro principale.

## Esperienza utente

- Il dock dei controlli è nascosto all'avvio su tutte le viewport.
- L'header mostra in alto a destra un bottone accessibile per aprire e chiudere i controlli del grafo.
- Il dock aperto appare come popover compatto sotto l'header, allineato a destra, senza modificare il layout del grafo.
- Un clic/tap fuori dal popover o il tasto Escape lo chiude. Il focus torna al bottone che lo ha aperto.
- Il testo di aiuto di Split & Bridge è `Select 2 edges or enter their IDs.`.

## Layout Split & Bridge

- Il pannello mantiene la posizione sovrapposta al grafo, ma usa padding, spaziature e tipografia ridotti.
- La larghezza resta contenuta e responsive.
- I due campi edge e il pulsante `S&B` restano sulla stessa riga anche su viewport strette, con colonne flessibili e input utilizzabili.
- Non cambia il modello dati né il flusso di trasformazione: selezione degli edge, sincronizzazione input, validazione e `splitAndBridgeEdges` restano invariati.

## Accessibilità e comportamento

- Il bottone menu espone nome accessibile, `aria-controls` e `aria-expanded`.
- Il popover usa un landmark `nav` con `aria-label="Graph tools"`.
- Il popover non deve essere raggiungibile da tastiera quando è chiuso.
- L'apertura e la chiusura devono rispettare il supporto esistente per Escape e focus trap del drawer Settings.
- I controlli esistenti del dock mantengono ID, etichette e comportamento.

## Implementazione

- Estendere il pattern di stato/UI già usato per Settings con uno stato separato per il popover dei tools.
- Riutilizzare il backdrop solo se compatibile con l'uso leggero del popover; in caso contrario gestire la chiusura con listener documentale per clic esterno e keydown per Escape.
- Usare `hidden` o uno stato equivalente per impedire interazione e tab focus quando il dock è chiuso.
- Aggiornare i test statici Node esistenti per verificare markup, copy, stato iniziale chiuso e regole CSS responsive.

## Verifica

- `node --test tests/split_and_bridge.test.js` deve passare.
- Verificare manualmente la pagina su viewport desktop e mobile: il grafo occupa più spazio, il pannello non diventa verticale, il menu apre/chiude i controlli e Settings continua ad aprirsi correttamente.
- Verificare Escape, clic esterno, focus da tastiera e riduzione movimento.
