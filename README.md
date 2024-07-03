<span style="font-size:1.3em;">HSPR - Heitespordi Seeriavõistluste Punktiarvestuse Rakendus</span> <br/>

![Edetabel](Edetabelidvalja_logitud.jpg)
![Sisestamine](addresults.jpg)
![Tulemused](allresults.jpg)

<span style="font-size:1.3em;">Eesmärk ja lühikirjeldus</span> <br/>

Projekti eesmärgiks oli edasi arendada heitjate seeriavõistluste korraldamiseks loodud veebirakendust, mis lihtsustab võistlustel punktide arvestust ja edetabeli koostamist. Rakendus loob automaatse edetabeli võttes arvesse mitmevõistluse nõuet: sportlase 3+2+1 parima ala tulemust ja 2 hoota kaugushüppe tulemust.
Meie poolt loodud rakenduses on:
* Uuendatud kujundus
* Tulemuste sisestamise on kiirem ja lihtsam
* Lisatud tulemuste ja sportlaste nimede muutmise võimalus
* Edetabeli automaatne uuendus uute tulemuste lisandumisel
* Filtreerimise ja otsimise võimalused edetabelis ja tulemuste tabelis

HSPR veebileht on valminud [Tallinna Ülikooli Digitehnoloogiate instituudi](https://www.tlu.ee/dt) tarkvaraarenduse projekti suvepraktika raames.

<span style="font-size:1.3em;">Kasutatud tehnoloogiad</span>
* JavaScript ES7
* node.js v16.20.1
* express.js
* HTML5
* MySQL / MariaDB
* CSS3
* Git / GitHub

<span style="font-size:1.3em;">Projekti autorid</span> <br />

Taavi Vendt <br />
Ester Ojala <br />
Ander Aava <br />
Kristjan Sarv <br />
Jörgen Kristofer Rebane

<span style="font-size:1.3em;">Paigaldusjuhised</span> <br />

* Lae projekti repositooriumis olevad failid GitHubist alla ja lisa need serverisse loodud kausta (kasutades failide lisamiseks nt WinSCP).
* Loo andmebaasi tabelid kasutades selleks createSQL.txt failis olevaid käske.
* Loo dbConfig.js fail projekti avalikust kaustast välja poole ja muuda sisu vastavalt enda andmebaasi kasutaja andmetega. <br />
Näide dbConfig.js: <br />
exports.configData = { <br />
&emsp;&emsp;&emsp;host: 'hosti nimi', <br />
&emsp;&emsp;&emsp;user: 'kasutajanimi', <br />
&emsp;&emsp;&emsp;password: 'parool', <br />
&emsp;&emsp;&emsp;database: 'andmebaasi nimi' <br />
};

* Veendu, et src/databasePromise.js failis olev path dbConfig failile oleks õige:
const dbConfig = require('../../dbConfig');
* Terminali kasutades logi sisse oma serverisse ja navigeeri cd käsu abil projekti kausta.
* Käivita veebirakendus kasutades käsku node index.js. <br />

<span style="font-size:1.3em;">Litsents</span> <br />

See projekt on MIT litsentsi all - vaata [LICENSE.md](https://github.com/TLU-DTI/HSPR_ryhm_6/blob/main/LICENSE.md) faili täpsema info jaoks.
