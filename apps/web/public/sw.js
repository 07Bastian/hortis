self.addEventListener("push", (event) => {
  let data = { title: "Hortis", body: "Neue Erinnerung" };
  try {
    data = event.data ? event.data.json() : data;
  } catch {
    /* ignore */
  }
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body }));
});
