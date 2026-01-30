# Audio Sampler

**M1 INFORMATIQUE DS4H – UE WEB**

Ce projet a été réalisé dans le cadre du **Master 1 Informatique** de DS4H, **UE WEB**, dirigé par **Michel Buffa**.
Il s’agit d’un **sampler audio web** permettant de gérer et de jouer des sons via un frontend Angular, un sampler HTML/JS, et un backend NodeJS.

### Auteurs
- [Jean-Jacques VIALE](https://github.com/JJ-vle)
- [Keryann RAZAFINDRABE](https://github.com/KeryannR)

De nombreux éléments de code sont basé sur les cours de [Michel Buffa](https://github.com/micbuffa) :
- [https://github.com/micbuffa/M1InfoWebTechnos2025_2026](https://github.com/micbuffa/M1InfoWebTechnos2025_2026)
- [https://github.com/micbuffa/AngularFrontEndM1Info2025_2026](https://github.com/micbuffa/AngularFrontEndM1Info2025_2026)

## Organisation des fichiers

Le dépôt est décomposé en 3 dossiers majeurs : 
- AngularFrontEnd
- API
- Sampler
Chacune de ces parties vont être décrites plus bas dans ce fichier.

---

## Sampleur (Frontend)

Le **Sampler** est l’interface audio principale permettant de jouer et de manipuler les sons.
Il est découpé en deux parties principales : le **GUI** (interface utilisateur) et le **Moteur Audio**.

### Fonctionnalités implémentées

Par manque de temps, seules les fonctionnalités **obligatoires** ont été majoritairement implémentées dans le sampleur, avec **deux optionnelles** en plus :

* Séparation claire entre GUI et moteur audio.
* Test en mode **headless** (sans GUI) pour vérifier le fonctionnement des sons.
* Menu de presets dynamique via une requête `fetch GET` vers l’API.
* Chargement des presets et affectation des sons aux pads selon l’ordre standard (kick, snare, etc.).
* Barres de progression animées lors du chargement des presets.
* Lecture des sons au clic sur un pad.
* Visualisation de la forme d’onde dans un canvas lors de la lecture.
* Possibilité de trimmer chaque son individuellement.
* *Optionnelle :* mapping des touches du clavier sur les pads pour jouer les sons.
* *Optionnelle :* groupement des presets par type dans la liste

### Mise en œuvre

Il est recommandé d’utiliser l’extension **[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)** de **VS Code**.

En parallèle l'**API** doit être lancée, la prochaine section décris comment l'utiliser.

#### Lancement de l’application avec GUI

1. Ouvrir le fichier `index.html` via **Open Live Server**.
2. L’application s’exécutera par défaut sur le port `5500`.
3. Remarque : l’affichage de la forme d’onde et des barres de trim peut rencontrer des problèmes sur certains navigateurs. **Edge** est recommandé pour une compatibilité optimale.

#### Lancement en mode headless

1. Ouvrir le fichier `index-headless.html` via **Open Live Server**.
2. L’application s’exécutera également sur le port `5500`.
3. Cliquer sur le bouton **Lancer le test headless** pour lancer les tests headless.

Ces tests permettent de vérifier la séparation entre le **GUI** et le **Moteur Audio**, sans interface visuelle.

---

## API (Backend)

Le backend **NodeJS** gère les presets et les fichiers audio pour le Sampler et l’application Angular.

### Fonctionnalités implémentées

**Obligatoires :**

* Endpoint `GET /presets` pour récupérer la liste des presets.
* Endpoint `POST /presets` pour créer un nouveau preset avec fichiers audio.
* Gestion des catégories de presets (drums, pianos, etc.).
* Stockage des presets sous forme de fichiers JSON.
* Sauvegarde des presets sur le serveur, avec possibilité d’ajouter de nouveaux sons.
* API prête à être utilisée par Angular et par le Sampler.
* Gestion des erreurs et des statuts HTTP corrects.

**Optionnelles :**

* Sauvegarde dans une base de données cloud MongoDB (implémentée, cf.`./API/mongo_screenshot.png`).
* Hébergement sur **Render.com** (déjà déployé : [https://audio-sampler.onrender.com/](https://audio-sampler.onrender.com/)).

### Mise en œuvre

#### Lancer le serveur en local

1. Cloner le dépôt et se placer dans le dossier `/API`.
2. Installer les dépendances :

```bash
npm install
```

3. Lancer le serveur :

```bash
node index.mjs
```

4. Le serveur écoute par défaut sur le port **3000** :

```
http://localhost:3000
```

#### Utilisation depuis le front-end

* Le Sampler et l’application Angular peuvent interagir avec l’API soit :

  * en **local** : `http://localhost:3000`
  * en **production** : `https://audio-sampler.onrender.com/`

---

## Angular Front-End

L’application **Angular** permet de gérer les presets depuis une interface web moderne et intuitive.

### Fonctionnalités implémentées

**Obligatoires :**

* Liste dynamique des presets récupérée depuis le backend.
* Renommage des presets.

**Optionnelles implémentées :**

* Suppression d’un preset.
* Création d’un nouveau preset en saisissant son nom et les URLs des sons.
* Upload de fichiers audio lors de la création d’un preset.

**Remarque :**
Toutes les fonctionnalités obligatoires et optionnelles pour Angular ont été implémentées. L’application communique directement avec le backend pour gérer les presets et leurs fichiers audio.

### Mise en œuvre

#### Prérequis

* NodeJS et Angular CLI installés sur votre machine.
* Le backend (API) doit être **lancé** avant de démarrer l’application Angular.

  * Local : `http://localhost:3000`
  * Production : `https://audio-sampler.onrender.com/`

**Remarque :** L’API hébergée sur Render utilise l’offre gratuite, ce qui bloque la création et la modification de fichiers côté serveur.
Cela peut poser des problèmes lors de l’ajout de nouveaux fichiers audio depuis l’application Angular. Pour cette fonctionnalité, il est donc recommandé d’utiliser le serveur en local.

#### Lancer l’application Angular

1. Ouvrir un terminal et se placer dans le dossier `/AngularFrontEnd`.
2. Installer les dépendances :

```bash
npm install
```

3. Lancer l’application :

```bash
ng serve
```

4. L’application sera accessible par défaut sur :

```
http://localhost:4200
```

5. Vous pouvez naviguer dans l’interface pour :

   * Visualiser la liste des presets.
   * Renommer, supprimer ou créer un preset.
   * Uploader des fichiers audio lors de la création d’un nouveau preset.

Afin de renommer ou supprimer un preset, il est d'abord nécessaire d'afficher les détails d'un preset.

---

## Travail en binôme et Utilisation de l’IA

### Travail en binôme

Ce projet a été réalisé en binôme :

* **Jean-Jacques VIALE** : travail principal sur tous les points du projet, incluant le Sampler, l'API (+ Hébergement Render et MongoDB) et l’application Angular.
* **Keryann RAZAFINDRABE** : assistance principalement sur le front-end du Sampler.

### Utilisation de l’IA

L’IA a été utilisée uniquement comme outil d’assistance via la version **gratuite de ChatGPT** pour faciliter le développement et la documentation.

**Angular :**
* Création d’un bouton d'ajout de fichier personnalisé.
* Débogage de la connexion à l’API (ajout manquant de `provideHttpClient()`).

**Sampleur :**
* Débogage des trimbars et du dessin des formes d’onde (au final le problème venait du navigateur).
* Assistance pour la définition de l’objectif et l’exécution des tests headless.
* Aide pour assigner correctement les boutons de pads dans le bon ordre.
* Explications sur le fonctionnement de mapping de touches

**API (Backend) :**
* Assistance sur l’implémentation des filtres de requêtes MongoDB.

**Documentation :**
* Correction et amélioration du README pour le rendre homogène et clair.