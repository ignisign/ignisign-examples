# ignisign-ios

[![CI Status](https://img.shields.io/travis/Nigdelian/ignisign-ios.svg?style=flat)](https://travis-ci.org/Nigdelian/ignisign-ios)
[![Version](https://img.shields.io/cocoapods/v/ignisign-ios.svg?style=flat)](https://cocoapods.org/pods/ignisign-ios)
[![License](https://img.shields.io/cocoapods/l/ignisign-ios.svg?style=flat)](https://cocoapods.org/pods/ignisign-ios)
[![Platform](https://img.shields.io/cocoapods/p/ignisign-ios.svg?style=flat)](https://cocoapods.org/pods/ignisign-ios)

## Example

To run the example project, clone the repo, and run `pod install` from the Example directory first.

## Requirements

## Installation

ignisign-ios is available through [CocoaPods](https://cocoapods.org). To install
it, simply add the following line to your Podfile:

```ruby
pod 'ignisign-ios'
```

Classe principale: Pods/Development Pods/Ignisign
    - Contient les structs pour les différents paramètres d'initialisation.
    - Fonction debugPrint pour l'affichage conditionnel.
    - Pour utiliser Ignisign depuis un ViewController (exemple das SignContractViewController):
        1. Définir une instance de Ignisign comme une webview
        2. Définir une instance de WKWebViewConfiguration, qui va permettre d'écouter à l'intérieur de la webview.
        3. Définir une instance de IgnisignSignatureSessionDimensions
        4. Définir une instance de IgnisignJSSignatureSessionsDisplayOptions
        5. Définir une instance de IgnisignInitParams
        6. Appeler setValues
        7. Appeler initSignatureSession
        8. Le ViewController doit étendre IgnisignJS_SignatureSession_Callbacks pour implémenter les callbacks de la session.
        
        
Récupération des contrats:
    - Classe IgnisignAPI pour fetcher.
    - La base URL est définie dans Config.
    - L'affichage est fait dans la vue ListContractsViewConroller
    - Un détail si la vue est modifiée, toutes les vues ajoutées à la "cellule" doivent l'etre sur self.contentView et non pas sur self.view, les interactions ne fonctionnent pas sinon.
    - Un pull to refresh permet de mettre la liste à jour avec de potentiels nouveaux contrats.
