# ignisign-android

Classe principale dans le module ignisign: ignisign/java/com/ignisign
Pour instancier une webview ignisign:
	1. Ajouter dans le layout de l'activité ou du fragment concerné une vue IgnisignAndroid
	2. Définir une instance de IgnisignSignatureSessionDimensions
	3. Définir une instance de IgnisignJSSignatureSessionsDisplayOptions
	4. Définir une instance de IgnisignInitParams
	5. Appeler setValues
	6. Appeler initSignatureSession
	7. L'activité ou le fragment appelant doit implémenter ISessionCallbacks pour recevoir les events.

Récupération des contrats:
	- Classe IgnisignAPI, qui contient l'interface Retrofit pour définir la route et le service IgnisignAPIService qui fetch les contrats.
	

Il reste encore l'ancienne structure avec le navigation drawer et les fragments pour récupérer les sellers et customers, pour les enlever il faut simplement supprimer les fichiers kt et xml associés, ils ne sont plus utilisés.

Si le besoin se présente d'ajouter des vues (activités) dans le projet de test, il faut les déclarer dans AndroidManifest.XML, sinon ça ne fonctionnera pas.

Pour tester la récupération des contrats via simulateur, l'équivalent du localhost est 10.0.0.2.


