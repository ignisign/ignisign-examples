//
//  ListContractsViewController.swift
//  ignisign-ios_Example
//
//  Created by Marc Nigdélian on 22/12/2023.
//  Copyright © 2023 CocoaPods. All rights reserved.
//

import UIKit

protocol ContractTableViewCellProtocol {
    func onTapped(indexPath: IndexPath)
}

class ContractTableViewCell: UITableViewCell {
    static let identifier = "ContractTableViewCell"
    var delegate: ContractTableViewCellProtocol?
    var indexPath: IndexPath?
    
    private let signButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Sign Contract", for: .normal)
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()
    
    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupButton()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func setupButton() {
        contentView.addSubview(signButton)
        NSLayoutConstraint.activate([
            signButton.trailingAnchor.constraint(equalTo: self.trailingAnchor, constant: -20),
            signButton.centerYAnchor.constraint(equalTo: self.centerYAnchor),
            signButton.heightAnchor.constraint(equalToConstant: 30)
        ])
        signButton.addTarget(self, action: #selector(signButtonTapped), for: .touchUpInside)
    }
    
    @objc private func signButtonTapped() {
        if let delegate = delegate, let indexPath = indexPath {
            delegate.onTapped(indexPath: indexPath)
        }
    }
}

class ListContractsViewController: UIViewController, UITableViewDataSource, ContractTableViewCellProtocol {
    var items = [ContractContext]()
    
    private let tableView = UITableView()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        tableView.dataSource = self
        tableView.register(ContractTableViewCell.self, forCellReuseIdentifier: ContractTableViewCell.identifier)
        view.addSubview(tableView)
        tableView.frame = view.bounds
        
        let refreshControl = UIRefreshControl()
        refreshControl.addTarget(self, action: #selector(refreshData(_:)), for: .valueChanged)
        tableView.refreshControl = refreshControl
        
        let ignisignApi = IgnisignAPI()
        ignisignApi.fetchContractContexts { objects, error in
            if let contracts = objects {
                print("objects : \(objects)")
                DispatchQueue.main.async {
                    self.items.removeAll()
                    self.items.append(contentsOf: contracts)
                    self.tableView.reloadData()
                }
            } else if let err = error {
                print("error : \(error)")
            }
        }
    }

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return items.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: ContractTableViewCell.identifier, for: indexPath) as! ContractTableViewCell
        cell.delegate = self
        cell.indexPath = indexPath
        cell.textLabel?.text = items[indexPath.row].documentId
        return cell
    }
    
    @objc private func refreshData(_ sender: UIRefreshControl) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            self.tableView.reloadData()
            sender.endRefreshing()
        }
    }
    
    func onTapped(indexPath: IndexPath) {
        print("trace click on cell : \(indexPath)")
        DispatchQueue.main.async {
            let item = self.items[indexPath.row]
            let vc = SignContractViewController()
            vc.signatureRequestId = item.signatureRequestId
            vc.signatureSessionToken = item.ignisignSignatureToken
            vc.signerAuthSecret = item.ignisignUserAuthSecret
            vc.signerId = item.ignisignSignerId
            self.navigationController?.pushViewController(vc, animated: true)
        }
    }
}

