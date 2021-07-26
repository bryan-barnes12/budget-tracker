let db;
let budgetVersion;

const request = indexedDB.open('budgetDB', budgetVersion || 10);

request.onupgradeneeded = function (event) {
  console.log('Upgrade needed in IndexDB');

  const { oldVersion } = event;
  const newVersion = event.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = event.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('budgetStore', { autoIncrement: true });
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

function checkDatabase() {
  let transaction = db.transaction(['budgetStore'], 'readwrite');
  const store = transaction.objectStore('budgetStore');
  const storeContents = store.getAll();
  storeContents.onsuccess = async function () {
    try {
      if (storeContents.result.length > 0 && navigator.onLine) {
        const bulkPost = await fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(storeContents.result),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
          });
          const jsonResponse = bulkPost.json();
          if (jsonResponse.length !== 0) {
              transaction = db.transaction(['budgetStore'], 'readwrite');
              const currentStore = transaction.objectStore('budgetStore');
              currentStore.clear();
          }
      }
    } catch (err) {
      console.log(err)
    }
  };
}

request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

const saveRecord = (data) => {
  const transaction = db.transaction(['budgetStore'], 'readwrite');
  const store = transaction.objectStore('budgetStore');
  store.add(data);
};

window.addEventListener('online', checkDatabase);
